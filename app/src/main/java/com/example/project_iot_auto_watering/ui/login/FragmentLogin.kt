package com.example.project_iot_auto_watering.ui.login

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.example.project_iot_auto_watering.R
import com.example.project_iot_auto_watering.databinding.FragmentLoginBinding
import com.example.project_iot_auto_watering.util.NavOption
import com.example.project_iot_auto_watering.util.setStateOpenedApp

class FragmentLogin : Fragment(), View.OnClickListener {
    private var _binding: FragmentLoginBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        _binding = FragmentLoginBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        //opened app
        setStateOpenedApp(requireContext(), true)

        initListener()
    }

    private fun initListener() {
        binding.login.setOnClickListener(this)
        binding.forgotPassword.setOnClickListener(this)
        binding.signUp.setOnClickListener(this)
        binding.googleicon.setOnClickListener(this)
    }

    override fun onClick(p0: View?) {
        when (p0?.id) {
            R.id.login -> {
                findNavController().navigate(R.id.action_fragmentLogin_to_fragmentHome)
            }

            R.id.forgotPassword -> {

            }

            R.id.signUp -> {
                findNavController().navigate(
                    R.id.action_fragmentLogin_to_fragmentSignUp,
                    null,
                    NavOption.animationFragment
                )
            }

            R.id.googleicon -> {

            }
        }
    }

}