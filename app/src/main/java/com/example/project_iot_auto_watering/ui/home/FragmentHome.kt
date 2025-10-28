package com.example.project_iot_auto_watering.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.MenuItem
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.project_iot_auto_watering.R
import com.example.project_iot_auto_watering.data.model.Crops
import com.example.project_iot_auto_watering.data.model.DataSensor
import com.example.project_iot_auto_watering.databinding.FragmentHomeBinding
import com.example.project_iot_auto_watering.ui.home.adapter.CropsAdapter
import com.google.android.material.navigation.NavigationBarView


class FragmentHome : Fragment(), View.OnClickListener,
    CropsAdapter.OnCropsClickListener, OnClickDialog {
    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!
    private var listDataSensor: List<DataSensor> = listOf()
    private var listCrops: List<Crops> = listOf()
    private lateinit var adapterCrops: CropsAdapter
    private lateinit var rcvCrops: RecyclerView

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root

    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        //data test
        val crops1 = Crops("1", "Tomato", "s1", System.currentTimeMillis())
        val dataSensor1 = DataSensor("s1", "28", "62", "0")
        listCrops = listOf(crops1)
        listDataSensor = listOf(dataSensor1)

        initListener()
        initAdapter()
    }

    private fun initListener() {

    }

    private fun initAdapter() {
        adapterCrops = CropsAdapter(listCrops, listDataSensor, this)


        rcvCrops = binding.rcvListCrops
        rcvCrops.layoutManager = LinearLayoutManager(requireContext())
        rcvCrops.adapter = adapterCrops
    }

    override fun onClick(p0: View?) {

    }


    override fun onBlankClick() {
        FragmentDialogCrops(this).show(parentFragmentManager, "CustomDialog")
    }

    override fun onCropsClick(
        crop: Crops,
        dataSensor: DataSensor
    ) {

    }

    override fun onClickIconAdd() {

    }
}